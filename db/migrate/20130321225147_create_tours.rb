class CreateTours < ActiveRecord::Migration
  def change
    create_table :tours do |t|
      t.string :name
      t.string :difficulty
      t.integer :tourtime
      t.line_string :path, :srid => 3785

      t.timestamps
    end
  end
end
